import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught UI error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100dvh",
            display: "grid",
            placeItems: "center",
            background: "#080810",
            color: "#f5f5f0",
            fontFamily: "inherit",
            padding: 20,
          }}
        >
          <div style={{ maxWidth: 380, textAlign: "center" }}>
            <div style={{ fontSize: 34, marginBottom: 8 }}>⚠️</div>
            <h1 style={{ margin: 0, fontSize: 20, marginBottom: 10 }}>Algo salio mal</h1>
            <p style={{ margin: 0, color: "rgba(245,245,240,0.7)", lineHeight: 1.6, marginBottom: 16 }}>
              Ocurrio un error inesperado. Puedes recargar para continuar.
            </p>
            <button
              onClick={this.handleReload}
              style={{
                border: "none",
                borderRadius: 10,
                padding: "10px 16px",
                cursor: "pointer",
                fontWeight: 700,
                background: "#60a5fa",
                color: "#f0f0f0",
                fontFamily: "inherit",
              }}
            >
              Recargar app
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
