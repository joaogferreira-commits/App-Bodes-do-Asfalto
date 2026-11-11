// Skia desenha só a profundidade; nos testes ela vira um componente vazio.
const Vazio = () => null;
export const Canvas = Vazio;
export const RoundedRect = Vazio;
export const BlurMask = Vazio;
export const Line = Vazio;
export const vec = (x: number, y: number) => ({ x, y });
