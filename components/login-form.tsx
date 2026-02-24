"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { toast } from "sonner"

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false) // 👈 NEW

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error("Login failed", {
          description: data.error || "Invalid email or password",
          duration: 4000,
        })
        return
      }

      toast.success("Login successful", {
        description: "Welcome back!",
        duration: 3000,
      })

      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))

      router.push("/dashboard")
      router.refresh()
    } catch (err: any) {
      toast.error("Error", {
        description: err.message || "Invalid email or password",
        duration: 4000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your email below to login to your account
          </p>
        </div>

        {/* Email */}
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value.trim())}
            required
            disabled={loading}
            autoComplete="email"
          />
        </Field>

        {/* Password with toggle */}
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>

          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"} // 👈 toggle
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="current-password"
              className="pr-10"
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </Field>

        {/* Submit */}
        <Field>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <span className="mr-2 animate-spin"></span>
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}