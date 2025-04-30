import React from "react";

const About: React.FC = () => {
  return (
    <main className="max-w-3xl mx-auto py-10 px-4 space-y-10">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold">About HireLens</h1>
        <p className="text-lg text-muted-foreground">
          Welcome to HireLens – where smart, AI-driven resume screening connects companies and candidates better than ever before.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Our Mission</h2>
        <p className="text-muted-foreground">
          At HireLens, we're on a mission to help companies and candidates connect better through smart, AI-driven resume screening. Our tools help reduce bias, speed up hiring, and find the right fit faster.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">What We Do</h2>
        <p className="text-muted-foreground">
          HireLens leverages cutting-edge artificial intelligence to analyze resumes and job descriptions, ensuring the best matches for both employers and job seekers. Our platform automates tedious screening processes, allowing recruiters to focus on what matters most: people.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Our Values</h2>
        <ul className="list-disc list-inside text-muted-foreground space-y-1">
          <li>Fairness and transparency in hiring</li>
          <li>Reducing bias in recruitment</li>
          <li>Empowering both companies and candidates</li>
          <li>Continuous innovation</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Why Choose HireLens?</h2>
        <p className="text-muted-foreground">
          With HireLens, companies hire faster and smarter, while candidates get a fairer shot at their dream roles. Join us in transforming the future of hiring.
        </p>
      </section>
    </main>
  );
};

export default About;
