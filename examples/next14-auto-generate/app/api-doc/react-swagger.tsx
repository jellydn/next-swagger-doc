"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

type Props = {
  spec: Record<string, any>;
};

/**
 * Swagger UI component for displaying API documentation
 */
export default function ReactSwagger({ spec }: Props) {
  return <SwaggerUI spec={spec} />;
}
