import { Badge } from './ui/badge'
import { Button } from './ui/button'

export function TokenList({ tokens, remove }: { tokens: string[]; remove: (token: string) => void }) {
  return <ul aria-label="선택된 토큰" className="flex flex-wrap gap-1">
    {tokens.map((token) => <li key={token} className="max-w-full">
      <Badge variant="outline" className="h-auto max-w-full whitespace-normal">
        <span className="wrap-anywhere">{token}</span>
        <Button size="icon-xs" variant="ghost" aria-label={`${token} 제거`} onClick={() => remove(token)}>×</Button>
      </Badge>
    </li>)}
  </ul>
}
