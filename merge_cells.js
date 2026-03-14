    var trim_blank_lines = function(text) {
        return text
            .replace(/^(?:[ \t]*\n)+/, '')
            .replace(/(?:\n[ \t]*)+$/, '');
    };

    var ends_with_indented_line = function(text) {
        var lines = text.split('\n');
        var last_line = lines[lines.length - 1];
        return /^[ \t]+/.test(last_line);
    };

    var merge_code_contents = function(contents) {
        if (contents.length === 0) {
            return '';
        }

        var merged = contents[0];
        for (var i = 1; i < contents.length; i++) {
            merged += ends_with_indented_line(contents[i - 1]) ? '\n\n' : '\n';
            merged += contents[i];
        }

        return merged;
    };

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
            contents.push(trim_blank_lines(this.get_cell(indices[i]).get_text()));
        }
        if (into_last) {
            contents.push(trim_blank_lines(target.get_text()));
        } else {
            contents.unshift(trim_blank_lines(target.get_text()));
        }

        // Update the contents of the target cell
        if (target instanceof codecell.CodeCell) {
            target.set_text(merge_code_contents(contents));
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
