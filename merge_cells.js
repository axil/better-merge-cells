    Notebook.prototype.merge_cells = function(indices, into_last) {
        if (indices.length <= 1) {
            return;
        }

        // Check if trying to merge above on topmost cell or wrap around
        // when merging above, see #330
        if (indices.filter(function(item) {return item < 0;}).length > 0) {
            return;
        }

        for (var i=0; i < indices.length; i++) {
            if (!this.get_cell(indices[i]).is_mergeable()) {
                return;
            }
        }
        var target = this.get_cell(into_last ? indices.pop() : indices.shift());

        // Get all the cells' contents
        var contents = [];
        for (i=0; i < indices.length; i++) {
            contents.push(this.get_cell(indices[i]).get_text());
        }
        if (into_last) {
            contents.push(target.get_text());
        } else {
            contents.unshift(target.get_text());
        }

        // Update the contents of the target cell
        if (target instanceof codecell.CodeCell) {
            target.set_text(contents.join('\n\n'));
        } else {
            var was_rendered = target.rendered;
            target.unrender(); // Must unrender before we set_text.
            target.set_text(contents.join('\n\n'));
            if (was_rendered) {
                // The rendered state of the final cell should match
                // that of the original selected cell;
                target.render();
            }
        }

        // Delete the other cells
        this.delete_cells(indices);
        
        // Reset the target cell's undo history
        target.code_mirror.clearHistory();

        this.select(this.find_cell_index(target));
    };
