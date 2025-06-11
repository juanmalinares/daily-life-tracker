// netlify/functions/saveData.js
const { Octokit } = require("@octokit/rest");

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Allow": "POST" },
      body: "Method Not Allowed",
    };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON in request body" }),
    };
  }

  const filename = `data-${Date.now()}.json`;
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString("base64");

  const [owner, repo] = process.env.GITHUB_REPO.split("/");
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  try {
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: `storage/${filename}`,
      message: `Save data ${filename}`,
      content,
    });
    return {
      statusCode: 200,
      body: JSON.stringify({ status: "saved", filename }),
    };
  } catch (err) {
    console.error("GitHub API error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};