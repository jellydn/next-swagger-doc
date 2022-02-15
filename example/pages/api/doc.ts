import { withSwagger } from 'next-swagger-doc';

const swaggerHandler = withSwagger({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Next Swagger API Example',
      version: '0.1.0',
    },
  },
});
export default swaggerHandler();
