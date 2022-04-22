import { describe, expect, it } from 'vitest';

import { createSwaggerSpec } from '../src/with-swagger';

describe('withSwagger', () => {
  it('should create default swagger json option', () => {
    expect(
      createSwaggerSpec({
        definition: {
          openapi: '3.0.0',
          info: {
            title: 'NextJS Swagger',
            version: '0.1.0',
          },
        },
      }),
    ).toMatchSnapshot();
  });
});
