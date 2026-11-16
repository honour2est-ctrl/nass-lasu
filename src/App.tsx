              {selectedExecutive.bio && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Biography</h4>
                  <p className="text-xs leading-relaxed text-slate-300">{selectedExecutive.bio}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedEventGallery && (
          <PageantGallery
            isOpen={!!selectedEventGallery}
            onClose={() => setSelectedEventGallery(null)}
            images={selectedEventGallery.images}
            title={selectedEventGallery.title}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
