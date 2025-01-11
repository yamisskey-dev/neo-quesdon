export interface SearchParams {
  [key: string]: string | string[] | undefined
}
  
export interface PageProps {
  params: { lng: string }
  searchParams?: SearchParams
}