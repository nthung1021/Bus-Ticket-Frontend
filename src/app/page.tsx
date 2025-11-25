export default function Home() {
  return (
    <section className="space-y-8 max-w-4xl mx-auto px-6 py-8">
      <div className="space-y-4">
        <h1 className="text-h1">Welcome to Bus Ticket Platform</h1>
        <p className="text-body max-w-lg text-muted-foreground">
          Book your bus tickets easily and efficiently. Our platform provides a seamless experience
          for travelers with real-time schedules, secure payments, and instant confirmations.
        </p>
        <div className="flex gap-4 pt-4">
          <button className="bg-primary text-primary-foreground rounded-lg px-6 py-3 hover:bg-primary/90 transition-colors">
            Book Now
          </button>
          <button className="bg-secondary text-secondary-foreground rounded-lg px-6 py-3 hover:bg-secondary/90 transition-colors">
            View Routes
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 pt-8">
        <div className="bg-card text-card-foreground p-6 rounded-lg border border-border">
          <h3 className="text-h4 mb-3">Easy Booking</h3>
          <p className="text-body text-muted-foreground">
            Search, compare, and book bus tickets in just a few clicks.
          </p>
        </div>
        <div className="bg-card text-card-foreground p-6 rounded-lg border border-border">
          <h3 className="text-h4 mb-3">Real-time Updates</h3>
          <p className="text-body text-muted-foreground">
            Get live updates on departure times, delays, and route changes.
          </p>
        </div>
        <div className="bg-card text-card-foreground p-6 rounded-lg border border-border">
          <h3 className="text-h4 mb-3">Secure Payment</h3>
          <p className="text-body text-muted-foreground">
            Safe and secure payment processing with multiple payment options.
          </p>
        </div>
      </div>
    </section>
  );
}
