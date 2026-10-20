// docx-preview renders pages at their fixed print width (~794px), which overflows
// phone screens. Scale the rendered pages down so they fit the container width.
export function fitDocxToWidth(container: HTMLElement) {
  const wrapper = container.querySelector<HTMLElement>(".docx-wrapper");
  const page = container.querySelector<HTMLElement>("section.docx");
  if (!wrapper || !page) return;
  wrapper.style.zoom = "1";
  const available = container.clientWidth - 16;
  const needed = page.scrollWidth;
  if (needed > 0 && available > 0 && needed > available) {
    wrapper.style.zoom = String(available / needed);
  }
}
