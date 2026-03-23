import dynamic from "next/dynamic"

const EditorClient = dynamic(() => import("@/components/EditorClient"), {
  ssr: false
})

export default function Page() {
  return <EditorClient />
}