import tencentcloud from "tencentcloud-sdk-nodejs-sts";
const { sts } = tencentcloud;
const required = (name) => { const value = process.env[name]; if (!value) throw new Error(`Missing ${name}`); return value; };
export default async function handler(request, response) {
  if (request.method !== "GET") return response.status(405).json({ error: "Method not allowed" });
  if (!process.env.UPLOAD_PASSWORD || request.headers["x-upload-password"] !== process.env.UPLOAD_PASSWORD) return response.status(401).json({ error: "Unauthorized" });
  try {
    const client = new sts.v20180813.Client({ credential: { secretId: required("TENCENT_SECRET_ID"), secretKey: required("TENCENT_SECRET_KEY") }, region: required("COS_REGION"), profile: { httpProfile: { endpoint: "sts.tencentcloudapi.com" } } });
    const resource = `qcs::cos:${required("COS_REGION")}:uid/${required("TENCENT_APP_ID")}:${required("COS_BUCKET")}/*`;
    const result = await client.AssumeRole({ RoleArn: required("TENCENT_COS_ROLE_ARN"), RoleSessionName: "portfolio-uploader", DurationSeconds: 1800, Policy: JSON.stringify({ version: "2.0", statement: [{ effect: "allow", action: ["name/cos:PutObject"], resource: [resource] }] }) });
    const now = Math.floor(Date.now() / 1000);
    return response.status(200).json({ tmpSecretId: result.Credentials.TmpSecretId, tmpSecretKey: result.Credentials.TmpSecretKey, sessionToken: result.Credentials.Token, startTime: now, expiredTime: now + 1800 });
  } catch (error) { console.error("COS STS error", error); return response.status(500).json({ error: "Failed to create temporary upload credentials" }); }
}
