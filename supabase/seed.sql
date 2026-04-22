insert into public.gifts (name, description, price, image_url, purchase_options)
values
  ('Bicicleta', 'Una bici per a eixir els caps de setmana.', 185, 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=400&q=80', '[{"store_name": "Decathlon", "price": 185, "link": "https://decathlon.es"}]'::jsonb),
  ('Lego gran', 'Set creatiu per a construir i jugar en família.', 79, 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?auto=format&fit=crop&w=400&q=80', '[{"store_name": "Amazon", "price": 75, "link": "https://amazon.es"}, {"store_name": "El Corte Inglés", "price": 79}]'::jsonb),
  ('Rellotge', 'Un detall especial per al dia de la comunió.', 120, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80', '[{"store_name": "Rellotgeria local", "price": 120}]'::jsonb),
  ('Llibres d''aventures', 'Pack de lectures per a l''estiu.', 45, 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80', '[{"store_name": "Casa del Llibre", "price": 45, "link": "https://casadellibro.com"}]'::jsonb);
