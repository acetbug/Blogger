import * as vscode from "vscode";

export function activate() {
  const disposable = vscode.commands.registerCommand(
    "blogger.newPost",
    async () => {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        vscode.window.showWarningMessage(
          "You should do this in a workspace folder."
        );
        return;
      }
      const workspaceUri = workspaceFolder.uri;

      const config = vscode.workspace.getConfiguration("blogger");
      let blogsDir = config.get<string>("path");
      if (!blogsDir) {
        blogsDir = await vscode.window.showInputBox({
          prompt: "Enter the relative path to the blog directory",
          placeHolder: "path/to/blogs",
        });
        if (!blogsDir) {
          vscode.window.showWarningMessage("You should provide a path.");
          return;
        }
        config.update("path", blogsDir);
      }

      const title = await vscode.window.showInputBox({
        prompt: "Enter the title of the post",
      });
      if (!title) {
        vscode.window.showWarningMessage("You should provide a title.");
        return;
      }

      const tagInput = await vscode.window.showInputBox({
        prompt: "Enter the tags for the post (comma separated)",
      });
      const tags = tagInput ? tagInput.split(",").map((tag) => tag.trim()) : [];

      const excerptInput = await vscode.window.showInputBox({
        prompt: "Enter the excerpt of the post",
      });
      const excerpt = excerptInput ? excerptInput : "";

      const imageUris = await vscode.window.showOpenDialog({
        canSelectMany: false,
        filters: {
          Images: ["png", "jpg", "jpeg", "gif"],
        },
      });
      const imageUri = imageUris?.[0];

      const blogsUri = vscode.Uri.joinPath(workspaceUri, blogsDir);
      const blogs = await vscode.workspace.fs.readDirectory(blogsUri);
      const newBlog = blogs.length.toString();
      const blogUri = vscode.Uri.joinPath(blogsUri, newBlog);
      vscode.workspace.fs.createDirectory(blogUri);

      const postUri = vscode.Uri.joinPath(blogUri, "index.md");
      await vscode.workspace.fs.writeFile(
        postUri,
        Buffer.from("# " + title + "\n\n> " + excerpt)
      );
      vscode.workspace.openTextDocument(postUri).then((doc) => {
        vscode.window.showTextDocument(doc);
      });

      const date = new Date();
      const dateStr =
        date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();

      const meta = {
        title: title,
        tags: tags,
        date: dateStr,
        excerpt: excerpt,
      };
      const metaUri = vscode.Uri.joinPath(blogUri, "meta.json");
      vscode.workspace.fs.writeFile(metaUri, Buffer.from(JSON.stringify(meta)));

      if (imageUri) {
        const coverUri = vscode.Uri.joinPath(blogUri, "cover.jpg");
        vscode.workspace.fs.copy(imageUri, coverUri);
      }
    }
  );
}
export function deactivate() {}
