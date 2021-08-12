var { expect } = require('chai')

const { parseBranchTag } = require('../utils')

describe('Util tests', function () {
  describe('parse repo/branch', function () {

    it('should return the main branch name on a valid input', function () {
      expect(parseBranchTag('refs/heads/main')).to.eql(['main', null]);
    });

    it('should return the tag_name on a valid input', function () {
      expect(parseBranchTag('refs/tags/1.0.0')).to.eql([null, '1.0.0']);
    });

    it('should return the branch/tag even when it contains "/" separator', function () {
      expect(parseBranchTag('refs/heads/ch23133/my-branch')).to.eql(['ch23133/my-branch', null]);
      expect(parseBranchTag('refs/tags/mytag/1.0.0')).to.eql([null, 'mytag/1.0.0']);
    });

    it('exception message should match expectations', function () {
      expect(function () { parseBranchTag('tags/badtag'); }).to.throw("Failed to parse branch/tag from tags/badtag");
    });

    it('should throw exception when bad input', function () {
      expect(function () { parseBranchTag('tags/badtag'); }).to.throw();
      expect(function () { parseBranchTag('/heads/main'); }).to.throw();
      expect(function () { parseBranchTag('main'); }).to.throw();
      expect(function () { parseBranchTag('v1.0.0'); }).to.throw();
    });
  });
});