import { useState } from "react";
import { CloudArrowUp, GearSix, Plus, X } from "@phosphor-icons/react";
import { isCosConfigured, loadCosConfig, saveCosConfig, syncManifest, uploadContentFile } from "./cosAssets";

export default function AdminPanel({ content, onContentChange }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [config, setConfig] = useState(() => loadCosConfig() || { secretId: "", secretKey: "" });
  const [title, setTitle] = useState("");

  async function saveConfig() {
    saveCosConfig(config);
    setStatus("密钥已仅保存到此浏览器。现在可以上传并同步。");
  }
  async function uploadGallery(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setStatus("正在上传图片并同步内容…");
      const url = await uploadContentFile(file, "content/gallery");
      const next = { ...content, galleryAssets: [...content.galleryAssets, { id: crypto.randomUUID(), url, label: title.trim() || file.name, alt: title.trim() || file.name }] };
      await syncManifest(next);
      onContentChange(next);
      setTitle(""); setStatus("已上传到 COS，画廊已自动同步。");
    } catch (error) { setStatus(error.message); }
    event.target.value = "";
  }
  async function uploadSiteMedia(event) {
    const file = event.target.files?.[0]; const field = event.target.dataset.field;
    if (!file || !field) return;
    try {
      setStatus("正在上传页面素材并同步…");
      const url = await uploadContentFile(file, "content/site");
      const next = { ...content, siteMedia: { ...content.siteMedia, [field]: url } };
      await syncManifest(next); onContentChange(next); setStatus("页面素材已同步到 COS。");
    } catch (error) { setStatus(error.message); }
    event.target.value = "";
  }
  async function addProject(event) {
    event.preventDefault(); const form = new FormData(event.currentTarget); const cover = form.get("cover");
    if (!(cover instanceof File) || !cover.size) return setStatus("请为项目选择背景图片。");
    try {
      setStatus("正在上传项目背景并同步…");
      const coverUrl = await uploadContentFile(cover, "content/projects");
      const next = { ...content, projects: [...content.projects, { id: crypto.randomUUID(), title: form.get("projectTitle"), type: form.get("projectType"), description: form.get("projectDescription"), coverUrl }] };
      await syncManifest(next); onContentChange(next); event.currentTarget.reset(); setStatus("项目已添加并同步到 COS。");
    } catch (error) { setStatus(error.message); }
  }
  if (!open) return <button className="admin-entry" type="button" onClick={() => setOpen(true)} aria-label="打开内容管理"><GearSix size={20} /></button>;
  return <aside className="admin-drawer" aria-label="内容管理"><header><strong>内容管理</strong><button type="button" onClick={() => setOpen(false)}><X size={20} /></button></header><div className="admin-scroll">
    <p className="admin-note">桶：liwanmin-0115-1454067572（广州）。每次上传或新增项目都会自动写入 COS 内容清单。</p>
    <section><h3>腾讯云授权</h3><input placeholder="SecretId（建议使用受限子账号）" value={config.secretId} onChange={(e) => setConfig({ ...config, secretId: e.target.value })}/><input type="password" placeholder="SecretKey" value={config.secretKey} onChange={(e) => setConfig({ ...config, secretKey: e.target.value })}/><button type="button" onClick={saveConfig}>保存授权</button></section>
    <section><h3>页面背景与素材</h3><label>首页背景视频<input type="file" accept="video/*" data-field="heroVideo" onChange={uploadSiteMedia}/></label><label>首页背景图<input type="file" accept="image/*" data-field="heroPoster" onChange={uploadSiteMedia}/></label><label>关于页图片<input type="file" accept="image/*" data-field="portrait" onChange={uploadSiteMedia}/></label><label>联系页背景<input type="file" accept="image/*" data-field="contactBackground" onChange={uploadSiteMedia}/></label></section>
    <section><h3>添加画廊图片</h3><input placeholder="图片名称" value={title} onChange={(e) => setTitle(e.target.value)}/><label className="upload-label"><CloudArrowUp size={18}/>选择图片<input type="file" accept="image/*" onChange={uploadGallery}/></label></section>
    <section><h3>添加项目</h3><form onSubmit={addProject}><input name="projectTitle" required placeholder="项目名称"/><input name="projectType" required placeholder="项目类型，例如 AI 短剧"/><textarea name="projectDescription" placeholder="项目简介"/><label>项目背景图片<input name="cover" type="file" accept="image/*" required/></label><button type="submit"><Plus size={16}/>添加并同步</button></form></section>
    <p className="admin-status">{status || (isCosConfigured() ? "COS 已配置。" : "请先保存 COS 授权后再上传。")}</p>
  </div></aside>;
}
