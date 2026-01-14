INSERT INTO public.profiles (id, email, role)
VALUES ('d9070fd6-a900-4980-b0c5-2208ca8bed21', 'lacolleacervelle+admin@gmail.com', 'admin')
ON CONFLICT (id) DO UPDATE 
SET role = 'admin', email = 'lacolleacervelle+admin@gmail.com';