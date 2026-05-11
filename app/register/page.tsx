import { redirect } from 'next/navigation'

/** Registration uses /home with signup mode; portal preference is saved on account creation. */
export default function RegisterRedirectPage() {
  redirect('/home?signup=1')
}
