import { createSwaggerSpec } from '../src/with-swagger';

describe('withSwagger', () => {
  it('should create default swagger json option', () => {
    expect(
      createSwaggerSpec({
        title: 'NextJS Swagger',
        version: '0.1.0',
      })
    ).toMatchSnapshot();
  });
});
