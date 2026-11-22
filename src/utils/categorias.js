export const CATEGORIAS_DESPESA = [
  "Alimentação",
  "Transporte",
  "Lazer",
  "Moradia",
  "Saúde",
  "Outros",
];

export const CATEGORIAS_RECEITA = ["Salário", "Outros"];

export function categoriasPorTipo(tipo) {
  if (tipo === "receita") {
    return CATEGORIAS_RECEITA;
  }
  return CATEGORIAS_DESPESA;
}
