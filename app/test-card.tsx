import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function TestCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Card</CardTitle>
        <CardDescription>This is a test description.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This is the content of the test card.</p>
      </CardContent>
    </Card>
  );
}