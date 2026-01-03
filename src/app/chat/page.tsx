"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Trash2, Bot, User as UserIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { chatService, Message } from "@/services/chat.service";
import toast from "react-hot-toast";

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedId = localStorage.getItem("chat_conversation_id");
    if (storedId) {
      setConversationId(storedId);
      loadHistory(storedId);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const loadHistory = async (id: string) => {
    try {
      setIsLoading(true);
      const history = await chatService.getHistory(id);
      setMessages(history);
    } catch (error) {
      console.error("Failed to load history", error);
      // If history load fails (e.g. 404), maybe clear the ID
      // localStorage.removeItem("chat_conversation_id");
      // setConversationId(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { role: "human", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage({
        message: userMsg.content,
        conversationId: conversationId || undefined,
      });

      if (!conversationId) {
        setConversationId(response.conversationId);
        localStorage.setItem("chat_conversation_id", response.conversationId);
      }

      // Update with history from server to ensure sync, or just append AI response
      // Using history from server ensures we have what the DB has
      setMessages(response.history);
    } catch (error) {
      console.error("Failed to send message", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!conversationId) return;
    
    try {
      await chatService.deleteHistory(conversationId);
      setMessages([]);
      setConversationId(null);
      localStorage.removeItem("chat_conversation_id");
      toast.success("Conversation history cleared");
    } catch (error) {
      console.error("Failed to clear history", error);
      toast.error("Failed to clear history");
    }
  };

  const renderMessageContent = (msg: Message) => {
    if (msg.role !== "ai") return msg.content;

    try {
      const parsed = JSON.parse(msg.content);
      if(parsed.tool_calls && Array.isArray(parsed.tool_calls)) {
        for(const call of parsed.tool_calls) {
          if(call.tool_name === "save_booking_data" && call.parameters) {
            const params = call.parameters;
            const bookingData = {
              bookingId: params.bookingId,
              bookingReference: params.bookingReference,
              tripId: params.tripId,
              seats: params.seats,
              passengers: params.passengers,
              totalPrice: params.totalPrice,
              isGuestCheckout: params.isGuestCheckout,
              contactEmail: params.contactEmail,
              contactPhone: params.contactPhone,
            };
            sessionStorage.setItem("bookingData", JSON.stringify(bookingData));
          }
        }
      }
      return typeof parsed === "object" && parsed !== null ? parsed.content || msg.content : msg.content;
    } catch (error) {
      return msg.content;
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-8 h-[calc(100vh-4rem)]">
      <Card className="h-full flex flex-col shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <Avatar className="h-10 w-10 bg-primary/10">
              <AvatarFallback><Bot className="h-6 w-6 text-primary" /></AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>AI Assistant</CardTitle>
              <p className="text-sm text-muted-foreground">Ask me anything about bus tickets</p>
            </div>
          </div>
          {messages.length > 0 && (
            <Button variant="ghost" size="icon" onClick={handleClearHistory} title="Clear History">
              <Trash2 className="h-5 w-5 text-muted-foreground hover:text-destructive" />
            </Button>
          )}
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full p-4">
            <div className="flex flex-col gap-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground opacity-50">
                  <Bot className="h-16 w-16 mb-4" />
                  <p>No messages yet. Start a conversation!</p>
                </div>
              )}
              
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    msg.role === "human" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <Avatar className={`h-8 w-8 ${msg.role === "human" ? "bg-blue-100" : "bg-gray-100"}`}>
                    <AvatarFallback>
                      {msg.role === "human" ? (
                        <UserIcon className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Bot className="h-4 w-4 text-gray-600" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div
                    className={`rounded-lg px-4 py-2 max-w-[80%] ${
                      msg.role === "human"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm">
                      {renderMessageContent(msg)}
                    </p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 bg-gray-100">
                    <AvatarFallback><Bot className="h-4 w-4 text-gray-600" /></AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg px-4 py-2 flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-xs text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>
        </CardContent>
        
        <CardFooter className="border-t p-4">
          <div className="flex w-full gap-2">
            <Input
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
