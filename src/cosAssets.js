import COS from "cos-js-sdk-v5";

export const COS_BUCKET = "liwanmin-0115-1454067572";
export const COS_REGION = "ap-guangzhou";
export const COS_PUBLIC_BASE_URL = `https://${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com`;
export const CONTENT_MANIFEST_KEY = "site/liwanmin-portfolio.json";

const ADMIN_SESSION_KEY = "liwanmin_upload_password";

export function cosAsset(fileName) {
  return `${COS_PUBLIC_BASE_URL}/assets/${fileName}`;
}

export function cosUrl(key) {
  return `${COS_PUBLIC_BASE_URL}/${key}`;
}

export function hasUploadSession() { return Boolean(sessionStorage.getItem(ADMIN_SESSION_KEY)); }
export function saveUploadSession(password) { sessionStorage.setItem(ADMIN_SESSION_KEY, password); }

async function createClient() {
  const password = sessionStorage.getItem(ADMIN_SESSION_KEY);
  if (!password) throw new Error("请先输入上传管理密码。");
  const response = await fetch("/api/cos-credentials", { headers: { "x-upload-password": password } });
  if (response.status === 401) { sessionStorage.removeItem(ADMIN_SESSION_KEY); throw new Error("上传管理密码不正确或已失效。"); }
  if (!response.ok) throw new Error("无法获取 COS 临时上传授权。");
  const credentials = await response.json();
  return new COS({ getAuthorization: (options, callback) => callback({ TmpSecretId: credentials.tmpSecretId, TmpSecretKey: credentials.tmpSecretKey, SecurityToken: credentials.sessionToken, StartTime: credentials.startTime, ExpiredTime: credentials.expiredTime }) });
}

export async function uploadToCos(file, key) {
  const cos = await createClient();
  return new Promise((resolve, reject) => {
    cos.putObject({
      Bucket: COS_BUCKET,
      Region: COS_REGION,
      Key: key,
      Body: file,
      ACL: "public-read",
    }, (error) => {
      if (error) reject(new Error(error.message || "COS 上传失败"));
      else resolve(cosUrl(key));
    });
  });
}

export function uploadContentFile(file, folder) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "file";
  const key = `${folder}/${Date.now()}-${safeName}`;
  return uploadToCos(file, key);
}

export async function syncManifest(content) {
  const blob = new Blob([JSON.stringify({ ...content, updatedAt: new Date().toISOString() }, null, 2)], {
    type: "application/json",
  });
  return uploadToCos(blob, CONTENT_MANIFEST_KEY);
}

export async function loadManifest() {
  const response = await fetch(`${cosUrl(CONTENT_MANIFEST_KEY)}?v=${Date.now()}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`读取 COS 内容清单失败（HTTP ${response.status}）`);
  return response.json();
}

// COS 文件尚未上传或暂时不可用时，继续使用随网站构建发布的本地资源。
export function useLocalAssetFallback(event) {
  const fallbackUrl = event.currentTarget.dataset.fallbackSrc;
  if (!fallbackUrl || event.currentTarget.dataset.usingLocalFallback === "true") return;
  event.currentTarget.dataset.usingLocalFallback = "true";
  event.currentTarget.src = fallbackUrl;
}
