'use client';

import SwaggerUI from 'swagger-ui-react';

import 'swagger-ui-react/swagger-ui.css';

type Props = {
  spec: Record<string, any>;
};

function ReactSwagger({ spec }: Props) {
  // @ts-ignore - SwaggerUI is not typed
  return <SwaggerUI spec={spec} />;
}

export default ReactSwagger;
