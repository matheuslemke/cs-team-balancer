-- Create battles table to store team matchups
CREATE TABLE public.battles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  team1_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  team2_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.battles ENABLE ROW LEVEL SECURITY;

-- Create policy for public access
CREATE POLICY "Allow all operations on battles" ON public.battles FOR ALL USING (true) WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_battles_updated_at
  BEFORE UPDATE ON public.battles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_battles_session_id ON public.battles(session_id);
CREATE INDEX idx_battles_team1_id ON public.battles(team1_id);
CREATE INDEX idx_battles_team2_id ON public.battles(team2_id);
CREATE INDEX idx_battles_created_at ON public.battles(created_at);