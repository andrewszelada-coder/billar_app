import { supabase } from './src/config/supabase.js';

async function check() {
  const { data: mesas, error } = await supabase.from('mesas').select('*');
  console.log('Mesas:', mesas);
  const { data, error: insertError } = await supabase.from('mesas').insert([
    { numero: 'Mesa 5', tipo: 'Pool', tarifa_hora: 20, estado: 'LIBRE' }
  ]).select();
  console.log('Insert Data:', data);
  console.log('Insert Error:', insertError);
}

check();
