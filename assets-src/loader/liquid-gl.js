// «До краёв»: how the pour is drawn (docs/CONVENTIONS.md, «До краёв: the loader»). WebGL2 on the worker's
// OffscreenCanvas (liquid-worker.js), from what KDLiquid.view() says each frame, in the site's ink and
// nothing more: one flat colour with its faint grain, no second tone, no highlight. The pool, the stream and
// the droplets are one liquid, a field that is 0.5 at every edge (the pool's surface, the stream's sides,
// each droplet's rim), so a droplet leaving the surface or falling back, and the stream where it plunges
// in, join it smoothly. The droplets reach it as a field drawn beforehand into a texture of their own.
// scripts/build-loader.mjs squeezes every /*glsl*/ string.
// Read by liquid-worker.js, later in the same bundle.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var KDGlass = (function () {
  "use strict";

  var VS_FULL = /*glsl*/ `#version 300 es
in vec2 aP;
void main() { gl_Position = vec4(aP, 0.0, 1.0); }
`;

  var FS_INK = /*glsl*/ `#version 300 es
precision highp float;
precision highp sampler2D;
uniform sampler2D uSurf;   // the surface's screen y at each column (CSS px)
uniform sampler2D uStream; // the stream at each row: x, half width (CSS px)
uniform sampler2D uField;  // the droplets, as a field
uniform vec4 uView;        // CSS width, height, backing px to the CSS px, droplets (0 or 1)
uniform vec4 uCount;       // columns, rows, the stream's top and bottom (CSS px; bottom < 0: none)
out vec4 o;

const vec3 INK = vec3(20.0, 18.0, 16.0) / 255.0;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
// The surface's y at x, between columns.
float surf(float x) {
  float f = clamp(x / uView.x, 0.0, 1.0) * (uCount.x - 1.0);
  float i = min(floor(f), uCount.x - 2.0);
  float a = texelFetch(uSurf, ivec2(int(i), 0), 0).r;
  float b = texelFetch(uSurf, ivec2(int(i) + 1, 0), 0).r;
  return mix(a, b, f - i);
}
// The stream at y, between rows (an empty row keeps its neighbour's x, so an end tapers in place).
vec2 row(float y) {
  float f = clamp(y / uView.y, 0.0, 1.0) * (uCount.y - 1.0);
  float i = min(floor(f), uCount.y - 2.0);
  vec2 a = texelFetch(uStream, ivec2(int(i), 0), 0).rg;
  vec2 b = texelFetch(uStream, ivec2(int(i) + 1, 0), 0).rg;
  vec2 r = mix(a, b, f - i);
  if (a.y <= 0.0) r.x = b.x;
  else if (b.y <= 0.0) r.x = a.x;
  return r;
}

void main() {
  float q = uView.z;
  vec2 p = vec2(gl_FragCoord.x, uView.y * q - gl_FragCoord.y) / q;
  float F = clamp(0.5 + (p.y - surf(p.x)) / 5.0, 0.0, 1.0);
  if (uCount.w >= 0.0 && p.y >= uCount.z - 3.0 && p.y <= uCount.w + 3.0) {
    vec2 r = row(p.y);
    if (r.y > 0.0) {
      float u = abs(p.x - r.x) / (1.848 * r.y);
      if (u < 1.0) {
        float w = 1.0 - u * u;
        F += w * w;
      }
    }
  }
  if (uView.w > 0.5) F += texture(uField, gl_FragCoord.xy / vec2(textureSize(uField, 0))).r;
  float aa = max(fwidth(F), 1e-4) * 0.7;
  float a = smoothstep(0.5 - aa, 0.5 + aa, F);
  // The ink's grain, as public/tex/grain-dark.png at 0.3 has it: sparse faint white specks, one to the CSS px.
  float g = max(0.0, (hash(floor(p)) - 0.58) / 0.42);
  vec3 c = mix(INK, vec3(1.0), g * g * 0.0353);
  o = vec4(c * a, a);
}
`;

  // A droplet's share of the field: a point sprite reaching 1.848 radii, 0.5 at the droplet's rim.
  var VS_DROP = /*glsl*/ `#version 300 es
in vec4 aB;              // x, y, radius (CSS px), spare
uniform vec4 uView;
out float vR;
void main() {
  gl_Position = vec4(aB.x / uView.x * 2.0 - 1.0, 1.0 - aB.y / uView.y * 2.0, 0.0, 1.0);
  gl_PointSize = 2.0 * (aB.z * 1.848 + 1.0) * uView.z;
  vR = aB.z * uView.z;
}
`;

  var FS_DROP = /*glsl*/ `#version 300 es
precision highp float;
uniform vec4 uView;
in float vR;
out vec4 o;
void main() {
  vec2 v = gl_PointCoord * 2.0 - 1.0;
  float rr = 1.848 * vR + uView.z;
  float u = dot(v, v) * (rr * rr) / (3.415 * vR * vR);
  float w = max(0.0, 1.0 - u);
  o = vec4(w * w, 0.0, 0.0, 1.0);
}
`;

  // Makes the renderer on `canvas` and calls `done` with it once its shaders are built: null without
  // WebGL2, { errors } if a shader would not build. With KHR_parallel_shader_compile the driver builds them
  // on threads of its own while this only looks in now and then, so nothing waits on them: not this
  // worker, and not the GPU process that is painting the page at the same time.
  function create(canvas, done) {
    var gl = null, t0 = performance.now();
    try {
      gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
    } catch {
      gl = null;
    }
    if (!gl) return done(null);
    var tCtx = performance.now() - t0;
    var lost = false;
    if (canvas.addEventListener) canvas.addEventListener("webglcontextlost", function (e) { lost = true; e.preventDefault(); });
    var par = gl.getExtension("KHR_parallel_shader_compile");

    function shader(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }
    function link(vs, fs, attrs) {
      var p = gl.createProgram(), a = shader(gl.VERTEX_SHADER, vs), b = shader(gl.FRAGMENT_SHADER, fs);
      gl.attachShader(p, a);
      gl.attachShader(p, b);
      for (var i = 0; i < attrs.length; i++) gl.bindAttribLocation(p, i, attrs[i]);
      gl.linkProgram(p);
      return { p: p, a: a, b: b, u: {} };
    }
    var pInk = link(VS_FULL, FS_INK, ["aP"]);
    var pDrop = link(VS_DROP, FS_DROP, ["aB"]);
    var built = [pInk, pDrop];

    function texture(filter) {
      var t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    }
    var tSurf = texture(gl.NEAREST), tStream = texture(gl.NEAREST), tField = texture(gl.LINEAR);
    var fbo = gl.createFramebuffer();
    var full = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, full);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var vaoFull = gl.createVertexArray();
    gl.bindVertexArray(vaoFull);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    var bDrops = gl.createBuffer(), vaoDrops = gl.createVertexArray();
    gl.bindVertexArray(vaoDrops);
    gl.bindBuffer(gl.ARRAY_BUFFER, bDrops);
    gl.bufferData(gl.ARRAY_BUFFER, 64 * 16, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    var bw = 0, bh = 0, sx = 0, sy = 0, W = 1, H = 1, Q = 1;
    function size(w, h, q) {
      W = w;
      H = h;
      Q = q;
      bw = Math.max(1, Math.round(w * q));
      bh = Math.max(1, Math.round(h * q));
      canvas.width = bw;
      canvas.height = bh;
      gl.bindTexture(gl.TEXTURE_2D, tField);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, bw, bh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tField, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    // A row of n floats (or pairs of them) into a texture, allocated again only when n changes.
    function upload(t, n, data, known, inner, format) {
      gl.bindTexture(gl.TEXTURE_2D, t);
      if (known !== n) gl.texImage2D(gl.TEXTURE_2D, 0, inner, n, 1, 0, format, gl.FLOAT, data);
      else gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, n, 1, format, gl.FLOAT, data);
      return n;
    }

    function draw(v) {
      if (lost || !bw) return;
      sx = upload(tSurf, v.SX, v.surf, sx, gl.R32F, gl.RED);
      sy = upload(tStream, v.SY, v.stream, sy, gl.RG32F, gl.RG);
      gl.viewport(0, 0, bw, bh);
      var drops = v.nDrops > 0;
      if (drops) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.useProgram(pDrop.p);
        gl.uniform4f(pDrop.u.uView, W, H, Q, 0);
        gl.bindVertexArray(vaoDrops);
        gl.bindBuffer(gl.ARRAY_BUFFER, bDrops);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, v.drops, 0, v.nDrops * 4);
        gl.drawArrays(gl.POINTS, 0, v.nDrops);
        gl.disable(gl.BLEND);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }
      gl.useProgram(pInk.p);
      var u = pInk.u;
      gl.uniform4f(u.uView, W, H, Q, drops ? 1 : 0);
      gl.uniform4f(u.uCount, v.SX, v.SY, v.top, v.bottom);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tSurf);
      gl.uniform1i(u.uSurf, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, tStream);
      gl.uniform1i(u.uStream, 1);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, tField);
      gl.uniform1i(u.uField, 2);
      gl.bindVertexArray(vaoFull);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
    }
    function clear() {
      if (lost) return;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    // A built program's uniforms (false if it would not link).
    var errors = [];
    function finish(b) {
      if (!gl.getProgramParameter(b.p, gl.LINK_STATUS)) {
        errors.push((gl.getShaderInfoLog(b.a) || "") + (gl.getShaderInfoLog(b.b) || "") + (gl.getProgramInfoLog(b.p) || ""));
        return false;
      }
      var n = gl.getProgramParameter(b.p, gl.ACTIVE_UNIFORMS);
      for (var k = 0; k < n; k++) {
        var info = gl.getActiveUniform(b.p, k);
        b.u[info.name] = gl.getUniformLocation(b.p, info.name);
      }
      return true;
    }
    (function wait() {
      if (gl.isContextLost()) return void done(null);
      if (par) for (var i = 0; i < built.length; i++) if (!gl.getProgramParameter(built[i].p, par.COMPLETION_STATUS_KHR)) return void setTimeout(wait, 4);
      var ok = true;
      for (i = 0; i < built.length; i++) ok = finish(built[i]) && ok;
      if (!ok) return void done({ errors: errors });
      done({ size: size, draw: draw, clear: clear, lost: function () { return lost || gl.isContextLost(); }, took: [Math.round(tCtx), Math.round(performance.now() - t0)] });
    })();
  }

  return { create: create };
})();
