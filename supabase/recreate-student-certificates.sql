-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can do everything with certificates" ON public.student_certificates;
DROP POLICY IF EXISTS "Managers and students can view certificates" ON public.student_certificates;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS set_student_certificates_updated_at ON public.student_certificates;

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS public.student_certificates_report_id_idx;
DROP INDEX IF EXISTS public.student_certificates_user_id_idx;

-- Drop existing table if it exists
DROP TABLE IF EXISTS public.student_certificates;

-- Create student_certificates table to store certificate links for each student in a report
CREATE TABLE public.student_certificates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id uuid REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
  user_id text NOT NULL,
  certificate_url text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure one certificate per student per report
  UNIQUE(report_id, user_id)
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.student_certificates ENABLE ROW LEVEL SECURITY;

-- Admins can do everything with certificates
CREATE POLICY "Admins can do everything with certificates"
  ON student_certificates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Managers and students can view certificates from completed reports
CREATE POLICY "Managers and students can view certificates"
  ON student_certificates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reports
      WHERE reports.id = student_certificates.report_id 
      AND reports.status = 'completed'
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role IN ('manager', 'student')
      )
    )
  );

-- Create indexes for better query performance
CREATE INDEX student_certificates_report_id_idx ON public.student_certificates(report_id);
CREATE INDEX student_certificates_user_id_idx ON public.student_certificates(user_id);

-- Add updated_at trigger to student_certificates
CREATE TRIGGER set_student_certificates_updated_at
  BEFORE UPDATE ON public.student_certificates
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();



