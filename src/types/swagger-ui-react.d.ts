declare module "swagger-ui-react" {
  import type { ComponentType } from "react";

  interface SwaggerUIProps {
    url: string;
    deepLinking?: boolean;
    displayRequestDuration?: boolean;
    filter?: boolean;
    docExpansion?: "list" | "full" | "none";
    defaultModelsExpandDepth?: number;
  }

  const SwaggerUI: ComponentType<SwaggerUIProps>;
  export default SwaggerUI;
}
