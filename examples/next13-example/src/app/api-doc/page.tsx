import { getApiDocs } from '../../lib/swagger';
import ReactSwagger from './ReactSwagger';

export async function ApiDocPage() {
  const spec = await getApiDocs();
  return <ReactSwagger spec={spec} />;
}

export default ApiDocPage;
