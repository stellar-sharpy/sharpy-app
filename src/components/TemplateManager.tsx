"use client";
import { useState } from "react";
export function TemplateManager() {
  const [templates, setTemplates] = useState<{name:string}[]>([]);
  const [name,setName]=useState("");
  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold">Templates</h3>
      <div className="flex gap-2 mt-2">
        <input className="border p-2 flex-1" value={name} onChange={e=> setName(e.target.value)} placeholder="template name" />
        <button className="bg-black text-white px-3" onClick={()=> { if(name) { setTemplates([...templates,{name}]); setName("");}}}>Create</button>
      </div>
      <ul className="mt-2">{templates.map(t=> <li key={t.name}>{t.name}</li>)}</ul>
    </div>
  );
}
