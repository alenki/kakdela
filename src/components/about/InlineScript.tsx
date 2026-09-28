/**
 * A script that runs as the server's HTML is parsed, before first paint (src/lib/about-script.ts). It is
 * the markup of a hidden wrapper, not a React <script>: React would create a script element on a
 * client-side visit, which never runs and which React warns about. As markup it simply stays inert there,
 * and the islands do its work instead.
 */
export function InlineScript({ code }: { code: string }) {
  return <div hidden dangerouslySetInnerHTML={{ __html: `<script>${code}</script>` }} />;
}
