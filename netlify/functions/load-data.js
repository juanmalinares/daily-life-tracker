const { Octokit } = require('@octokit/rest');

exports.handler = async () => {
  const [owner, repo] = process.env.GITHUB_REPO.split('/');
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  try {
    const { data: { tree } } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: 'HEAD',
      recursive: '1'
    });

    const files = tree
      .filter(f => f.path.startsWith('storage/') && f.type === 'blob')
      .map(f => ({
        sha: f.sha,
        path: f.path,
        ts: parseInt((f.path.match(/data-(\d+)\.json/) || [])[1] || '0', 10)
      }))
      .sort((a, b) => b.ts - a.ts);

    if (!files.length) {
      return { statusCode: 200, body: JSON.stringify({ data: [] }) };
    }

    const latest = files[0];
    const { data: blob } = await octokit.git.getBlob({
      owner,
      repo,
      file_sha: latest.sha
    });

    const content = Buffer.from(blob.content, 'base64').toString();
    return {
      statusCode: 200,
      body: content
    };
  } catch (err) {
    console.error('GitHub API error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};

