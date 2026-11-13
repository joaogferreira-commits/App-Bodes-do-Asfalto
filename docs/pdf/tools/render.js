const {chromium}=require('/opt/node-tools/node_modules/playwright');
(async()=>{
  const [html,pdf,titulo]=process.argv.slice(2);
  const b=await chromium.launch(); const p=await b.newPage();
  await p.goto('file://'+html); await p.waitForLoadState('load');
  const fs=`font-family:Arial,sans-serif;font-size:8.5pt;color:#6b625a;width:100%;padding:0 18mm;`;
  await p.pdf({path:pdf,format:'A4',printBackground:true,displayHeaderFooter:true,
    margin:{top:'24mm',bottom:'20mm',left:'18mm',right:'18mm'},
    headerTemplate:`<div style="${fs}border-bottom:1px solid #E8692A;padding-bottom:3px;margin-top:2mm;">${titulo}</div>`,
    footerTemplate:`<div style="${fs}text-align:center;">Página <span class="pageNumber"></span> de <span class="totalPages"></span></div>`});
  await b.close();
})();
