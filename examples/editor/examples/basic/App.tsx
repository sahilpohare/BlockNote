import {
  BaseSlashMenuItem,
  BlockNoteEditor,
  PartialBlock,
  SlashMenuQuery,
  uploadToTmpFilesDotOrg_DEV_ONLY,
} from "@sahilpohare-blocknote/core";
import "@sahilpohare-blocknote/core/style.css";
import { BlockNoteView, useBlockNote } from "@sahilpohare-blocknote/react";

type WindowWithProseMirror = Window & typeof globalThis & { ProseMirror: any };
export class CustomQueryManager extends SlashMenuQuery<
  any,
  any,
  any,
  BaseSlashMenuItem<any, any, any>
> {
  items = [];
  id = 0;
  constructor(public readonly queryChar: string = "/") {
    super(queryChar);
  }

  async query(q: string, items: any[]) {
    const url = (q: string) =>
      `https://aartas-qaapp-as.azurewebsites.net/aartas_uat/public/api/${q}/list`;
    const data = { search: q };

    const categories = ["complaints", "medicine"];
    const reqs = await Promise.all(
      categories.map((c) =>
        fetch(url(c), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })
      )
    );
    let resps = await Promise.all(reqs.map((r) => r.json()));
    resps = categories.map((c, i) => resps[i].data[c].slice(0, 10));
    const complaints = resps[0];
    const medicines = resps[1];
    //get first 10 items
    const j = complaints.map((i: any) => ({
      id: i.id,
      name: i.title,
      group: "Complaints",
      hint: "Complaint Name | Tag",
      execute: (editor: BlockNoteEditor) => {
        const currentBlock = editor.getTextCursorPosition().block;
        const id = crypto.randomUUID();

        const complaintItems: PartialBlock<any, any, any> = {
          id: id,
          type: "bulletListItem",
          content: [{ type: "text", text: i.title, styles: { bold: true } }],
        };
        const complaintBlock: PartialBlock<any, any, any> = {
          type: "paragraph",
          content: [
            { type: "text", text: "Complaint", styles: { bold: true } },
          ],
          children: [complaintItems],
        };
        //@ts-ignore
        editor.insertBlocks([complaintBlock], currentBlock, "after");
        editor.setTextCursorPosition(
          {
            id: id,
          },
          "end"
        );
      },
    }));
    const k = medicines.map((i: any) => ({
      id: i.id,
      name: i.display_name,
      group: "Medicines",
      hint: `${i.salt_name} | ${i.manufacturer} | ${i.display_name} | ${i.strength} | }`,
      execute: (editor: BlockNoteEditor) => {
        const currentBlock = editor.getTextCursorPosition().block;
        const id = crypto.randomUUID();

        const complaintItems: PartialBlock<any, any, any> = {
          id: id,
          type: "bulletListItem",
          content: [{ type: "text", text: i.title, styles: { bold: true } }],
        };
        const complaintBlock: PartialBlock<any, any, any> = {
          type: "paragraph",
          content: [{ type: "text", text: "Medicine", styles: { bold: true } }],
          children: [complaintItems],
        };
        //@ts-ignore
        editor.insertBlocks([complaintBlock], currentBlock, "after");
        editor.setTextCursorPosition(
          {
            id: id,
          },
          "end"
        );
      },
    }));

    return [...(await super.query(q, items)), ...j, ...k];
  }

  async execute({ item, editor }: { item: any; editor: any }) {
    return item.execute(editor);
  }
}
export function App() {
  console.log("App");
  const editor = useBlockNote({
    domAttributes: {
      editor: {
        class: "editor",
        "data-test": "editor",
      },
    },
    slashMenuQueryManager: new CustomQueryManager(),
    uploadFile: uploadToTmpFilesDotOrg_DEV_ONLY,
  });

  // Give tests a way to get prosemirror instance
  (window as WindowWithProseMirror).ProseMirror = editor?._tiptapEditor;

  return <BlockNoteView className="root" editor={editor} />;
}

export default App;
