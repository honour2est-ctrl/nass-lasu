import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './lib/firebase'; // Ensure this path matches your firebase config location

const HallOfFameSection = () => {
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    // This tells the site to listen to your database
    const unsub = onSnapshot(collection(db, 'hallOfFame'), (snapshot) => {
      setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  return (
    <section className="p-8">
      <h2 className="text-3xl font-bold text-white mb-6">Hall of Fame</h2>
      
      {members.length === 0 ? (
        <div className="text-slate-500 italic">
          No inductees yet. Add members via the Admin Panel.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {members.map((member) => (
            <div key={member.id} className="bg-slate-900 border border-white/10 p-6 rounded-2xl">
              {member.imageUrl && (
                <img 
                  src={member.imageUrl} 
                  alt={member.name} 
                  className="w-full h-64 object-cover rounded-xl mb-4" 
                />
              )}
              <h3 className="text-xl font-bold text-white">{member.name}</h3>
              <p className="text-yellow-400 font-semibold">{member.position}</p>
              <p className="text-slate-400 mt-2">{member.quote}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
