import React from "react";

export function Card({ children }: React.PropsWithChildren) {
  return <div className="rounded-md border p-4">{children}</div>;
}

export function CardHeader({ children }: React.PropsWithChildren) {
  return <div className="mb-2 font-semibold">{children}</div>;
}

export function CardTitle({ children }: React.PropsWithChildren) {
  return <h2 className="text-xl">{children}</h2>;
}

export function CardDescription({ children }: React.PropsWithChildren) {
  return <p className="text-gray-500">{children}</p>;
}

export function CardContent({ children }: React.PropsWithChildren) {
  return <div className="mt-2">{children}</div>;
}