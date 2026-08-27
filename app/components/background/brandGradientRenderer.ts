import {
  BRAND_GRADIENT_COLORS,
  FRAGMENT_SHADER,
  VERTEX_SHADER,
  hexToRgb,
  type BrandGradientTuning,
} from "./brandGradientShader";

type UniformMap = {
  uResolution: WebGLUniformLocation | null;
  uTime: WebGLUniformLocation | null;
  uColor1: WebGLUniformLocation | null;
  uColor2: WebGLUniformLocation | null;
  uColor3: WebGLUniformLocation | null;
  uBackground: WebGLUniformLocation | null;
  uOffset: WebGLUniformLocation | null;
  uZoom: WebGLUniformLocation | null;
  uWarp: WebGLUniformLocation | null;
  uAxis: WebGLUniformLocation | null;
  uAxisSpan: WebGLUniformLocation | null;
  uNoiseAmount: WebGLUniformLocation | null;
  uCycle: WebGLUniformLocation | null;
  uBrightness: WebGLUniformLocation | null;
  uVignette: WebGLUniformLocation | null;
  uGrain: WebGLUniformLocation | null;
};

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) {
    return null;
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[brand-gradient]", gl.getShaderInfoLog(shader));
    }
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/**
 * Draws the brand gradient into a canvas.
 *
 * One program, one buffer, one draw call per frame. The caller owns the frame
 * loop so it can throttle, pause off-screen and stop entirely under reduced
 * motion — the renderer itself never schedules work.
 */
export class BrandGradientRenderer {
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private buffer: WebGLBuffer | null = null;
  private uniforms: UniformMap | null = null;
  private width = 0;
  private height = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const attributes: WebGLContextAttributes = {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: "low-power",
    };
    const gl = (canvas.getContext("webgl2", attributes) ??
      canvas.getContext("webgl", attributes)) as WebGLRenderingContext | null;
    if (!gl) {
      return;
    }

    // GLSL ES 1.00 compiles unchanged under a WebGL2 context, so one shader
    // source serves both.
    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) {
      return;
    }

    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[brand-gradient]", gl.getProgramInfoLog(program));
      }
      gl.deleteProgram(program);
      return;
    }

    // A single oversized triangle covers the viewport with no seam down the
    // middle and one fewer vertex than a quad.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );

    const position = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.useProgram(program);

    this.gl = gl;
    this.program = program;
    this.buffer = buffer;
    this.uniforms = {
      uResolution: gl.getUniformLocation(program, "uResolution"),
      uTime: gl.getUniformLocation(program, "uTime"),
      uColor1: gl.getUniformLocation(program, "uColor1"),
      uColor2: gl.getUniformLocation(program, "uColor2"),
      uColor3: gl.getUniformLocation(program, "uColor3"),
      uBackground: gl.getUniformLocation(program, "uBackground"),
      uOffset: gl.getUniformLocation(program, "uOffset"),
      uZoom: gl.getUniformLocation(program, "uZoom"),
      uWarp: gl.getUniformLocation(program, "uWarp"),
      uAxis: gl.getUniformLocation(program, "uAxis"),
      uAxisSpan: gl.getUniformLocation(program, "uAxisSpan"),
      uNoiseAmount: gl.getUniformLocation(program, "uNoiseAmount"),
      uCycle: gl.getUniformLocation(program, "uCycle"),
      uBrightness: gl.getUniformLocation(program, "uBrightness"),
      uVignette: gl.getUniformLocation(program, "uVignette"),
      uGrain: gl.getUniformLocation(program, "uGrain"),
    };

    gl.uniform3fv(this.uniforms.uColor1, hexToRgb(BRAND_GRADIENT_COLORS.color1));
    gl.uniform3fv(this.uniforms.uColor2, hexToRgb(BRAND_GRADIENT_COLORS.color2));
    gl.uniform3fv(this.uniforms.uColor3, hexToRgb(BRAND_GRADIENT_COLORS.color3));
    gl.uniform3fv(
      this.uniforms.uBackground,
      hexToRgb(BRAND_GRADIENT_COLORS.background),
    );
  }

  get isSupported() {
    return this.gl !== null;
  }

  resize(width: number, height: number) {
    const gl = this.gl;
    if (!gl || width <= 0 || height <= 0) {
      return;
    }
    if (width === this.width && height === this.height) {
      return;
    }
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    gl.viewport(0, 0, width, height);
    gl.uniform2f(this.uniforms!.uResolution, width, height);
  }

  render(timeSeconds: number, tuning: BrandGradientTuning) {
    const gl = this.gl;
    if (!gl || !this.uniforms || this.width === 0) {
      return;
    }
    const u = this.uniforms;
    gl.uniform1f(u.uTime, timeSeconds * tuning.speed);
    gl.uniform2f(u.uOffset, tuning.offsetX, tuning.offsetY);
    gl.uniform1f(u.uZoom, tuning.zoom);
    gl.uniform1f(u.uWarp, tuning.warp);
    const angle = (tuning.axisAngle * Math.PI) / 180;
    gl.uniform2f(u.uAxis, Math.cos(angle), Math.sin(angle));
    gl.uniform1f(u.uAxisSpan, tuning.axisSpan);
    gl.uniform1f(u.uNoiseAmount, tuning.noiseAmount);
    gl.uniform1f(u.uCycle, timeSeconds * tuning.cycleSpeed);
    gl.uniform1f(u.uBrightness, tuning.brightness);
    gl.uniform1f(u.uVignette, tuning.vignette);
    gl.uniform1f(u.uGrain, tuning.grain);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  dispose() {
    const gl = this.gl;
    if (!gl) {
      return;
    }
    gl.deleteBuffer(this.buffer);
    gl.deleteProgram(this.program);
    // Frees the drawing buffer immediately instead of waiting for the context
    // to be collected — browsers cap how many live contexts a page may hold.
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    this.gl = null;
    this.program = null;
    this.buffer = null;
    this.uniforms = null;
  }
}
