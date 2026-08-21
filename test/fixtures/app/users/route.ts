// export function DELETE() {}
const string = 'export function DELETE() {}';

const handler = () => new Response(string);

export { handler as GET, handler as POST };
