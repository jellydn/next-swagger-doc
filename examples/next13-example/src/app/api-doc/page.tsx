import { getApiDocs } from '../../lib/swagger';
import ReactSwagger from './ReactSwagger';

async function ApiDocPage() {
  const spec = await getApiDocs();
  return <ReactSwagger spec={spec} />;
}

export default ApiDocPage;
