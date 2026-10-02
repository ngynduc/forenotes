import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import "./ApiExplorer.css";

export default function ApiExplorer() {
  return (
    <div className="api-explorer">
      <SwaggerUI
        url="/openapi.json"
        deepLinking
        displayRequestDuration
        filter
        docExpansion="none"
        defaultModelsExpandDepth={-1}
      />
    </div>
  );
}
