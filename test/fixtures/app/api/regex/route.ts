const URL_PATTERN = /^https?:\/\/[^\/*]*$/;

export function GET() {
  return new Response(String(URL_PATTERN.test('https://example.com')));
}
