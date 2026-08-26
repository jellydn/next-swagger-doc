'use client';

import dynamic from 'next/dynamic';

import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

type Props = {
  spec: Record<string, unknown>;
};

function ReactSwagger({ spec }: Props) {
  // swagger-ui-react still uses UNSAFE_componentWillReceiveProps
  // (ExamplesSelect, ParameterRow). That Strict Mode warning is from
  // Swagger UI, not next-swagger-doc.
  return <SwaggerUI spec={spec} />;
}

export default ReactSwagger;
