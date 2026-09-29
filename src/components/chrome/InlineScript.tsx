/**
 * A script that runs as the server's HTML is parsed, before first paint. It is the markup of a hidden wrapper, not
 * a React <script>: React would create a script element on a client-side visit, which never runs and which React
 * warns about. As markup it simply stays inert there, and the page's islands do its work instead. (The /about and
 * /menu pages keep copies of their own; this one is for any page, /locations first.)
 */
export function InlineScript({ code }: { code: string }) {
  return <div hidden dangerouslySetInnerHTML={{ __html: `<script>${code}</script>` }} />;
}
