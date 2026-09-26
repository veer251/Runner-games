// Single-file game launcher: all game files are embedded as resources, served on a private localhost port,
// and opened in Edge/Chrome "app mode" (own fullscreen window, no tabs/address bar). Closing the window exits.
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Reflection;
using System.Threading;
using System.Windows.Forms;

static class GameLauncher
{
    static readonly Dictionary<string, byte[]> Files = new Dictionary<string, byte[]>(StringComparer.OrdinalIgnoreCase);
    static string Root = null; // when set, files are served from this folder on disk (next to the exe)

    [STAThread]
    static int Main(string[] args)
    {
        var asm = Assembly.GetExecutingAssembly();
        // Prefer the game files that sit next to the exe (editable folder); fall back to embedded files.
        string exeDir = Path.GetDirectoryName(asm.Location);
        if (File.Exists(Path.Combine(exeDir, "index.html"))) Root = exeDir;
        else if (File.Exists(Path.Combine(exeDir, "game", "index.html"))) Root = Path.Combine(exeDir, "game");
        if (Root == null && asm.GetManifestResourceNames().Length == 0)
        {
            MessageBox.Show("index.html not found next to the exe.\nKeep the exe inside the game folder.", "Game");
            return 1;
        }
        foreach (var name in asm.GetManifestResourceNames())
        {
            using (var s = asm.GetManifestResourceStream(name))
            using (var ms = new MemoryStream())
            {
                s.CopyTo(ms);
                Files[name.Replace('\\', '/')] = ms.ToArray();
            }
        }

        HttpListener listener = null;
        int port = 0;
        var rnd = new Random();
        for (int i = 0; i < 40 && listener == null; i++)
        {
            port = 17000 + rnd.Next(3000);
            try { var l = new HttpListener(); l.Prefixes.Add("http://127.0.0.1:" + port + "/"); l.Start(); listener = l; }
            catch { listener = null; }
        }
        if (listener == null) { MessageBox.Show("Could not start the game server.", "Game"); return 1; }

        var server = new Thread(() => Serve(listener)) { IsBackground = true };
        server.Start();

        string url = "http://127.0.0.1:" + port + "/index.html";
        string browser = FindBrowser();
        if (browser == null)
        {
            Process.Start(url);
            MessageBox.Show("The game is open in your browser.\nClose this message to stop the game.", "Game");
            return 0;
        }

        string profile = Path.Combine(Path.GetTempPath(), "fpp_game_" + Guid.NewGuid().ToString("N"));
        var psi = new ProcessStartInfo(browser,
            "--app=\"" + url + "\" --start-fullscreen --user-data-dir=\"" + profile + "\" " +
            "--autoplay-policy=no-user-gesture-required --no-first-run --no-default-browser-check " +
            "--disable-features=Translate,msEdgeSidebarV2 --disable-pinch --overscroll-history-navigation=0")
        { UseShellExecute = false };
        var proc = Process.Start(psi);
        proc.WaitForExit();

        listener.Stop();
        try { Thread.Sleep(800); Directory.Delete(profile, true); } catch { }
        return 0;
    }

    static void Serve(HttpListener l)
    {
        while (l.IsListening)
        {
            HttpListenerContext ctx;
            try { ctx = l.GetContext(); } catch { return; }
            ThreadPool.QueueUserWorkItem(_ => Handle(ctx));
        }
    }

    static void Handle(HttpListenerContext ctx)
    {
        try
        {
            string path = Uri.UnescapeDataString(ctx.Request.Url.AbsolutePath).TrimStart('/');
            if (path == "") path = "index.html";
            byte[] data = null;
            if (Root != null)
            {
                string full = Path.GetFullPath(Path.Combine(Root, path.Replace('/', Path.DirectorySeparatorChar)));
                if (full.StartsWith(Root, StringComparison.OrdinalIgnoreCase) && File.Exists(full)) data = File.ReadAllBytes(full);
            }
            if (data != null || Files.TryGetValue(path, out data))
            {
                ctx.Response.ContentType = Mime(path);
                ctx.Response.AddHeader("Cache-Control", "no-store");
                ctx.Response.ContentLength64 = data.Length;
                ctx.Response.OutputStream.Write(data, 0, data.Length);
            }
            else ctx.Response.StatusCode = 404;
            ctx.Response.Close();
        }
        catch { }
    }

    static string Mime(string p)
    {
        string e = Path.GetExtension(p).ToLowerInvariant();
        switch (e)
        {
            case ".html": return "text/html; charset=utf-8";
            case ".js": return "application/javascript; charset=utf-8";
            case ".css": return "text/css; charset=utf-8";
            case ".json": return "application/json";
            case ".png": return "image/png";
            case ".jpg": case ".jpeg": return "image/jpeg";
            case ".webp": return "image/webp";
            case ".svg": return "image/svg+xml";
            case ".mp3": return "audio/mpeg";
            case ".wav": return "audio/wav";
            case ".ogg": return "audio/ogg";
            case ".woff2": return "font/woff2";
            case ".ttf": return "font/ttf";
            default: return "application/octet-stream";
        }
    }

    static string FindBrowser()
    {
        string pf = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
        string pf86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);
        string local = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        string[] c = {
            Path.Combine(pf86, @"Microsoft\Edge\Application\msedge.exe"),
            Path.Combine(pf, @"Microsoft\Edge\Application\msedge.exe"),
            Path.Combine(pf, @"Google\Chrome\Application\chrome.exe"),
            Path.Combine(pf86, @"Google\Chrome\Application\chrome.exe"),
            Path.Combine(local, @"Google\Chrome\Application\chrome.exe")
        };
        foreach (var p in c) if (File.Exists(p)) return p;
        return null;
    }
}
