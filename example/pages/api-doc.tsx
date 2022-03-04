import { GetStaticProps, InferGetStaticPropsType } from 'next';

import { createSwaggerSpec } from 'next-swagger-doc';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

const ApiDoc = ({ spec }: InferGetStaticPropsType<typeof getStaticProps>) => {
  return <SwaggerUI spec={spec} />;
};

export const getStaticProps: GetStaticProps = async () => {
  const spec: Record<string, any> = createSwaggerSpec({
    definition: {
      info: {
        title: 'NextJS Swagger',
        version: '0.1.0',
      },
    },
    schemaFolders: ['models'],
  });
  return {
    props: {
      spec,
    },
  };
};

export default ApiDoc;
