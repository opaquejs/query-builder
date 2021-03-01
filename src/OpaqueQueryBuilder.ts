import { OpaqueTable } from "@opaquejs/opaque";
import { ModelAttributes, OpaqueAttributes, PrimaryKeyValue } from "@opaquejs/opaque/lib/contracts/ModelContracts";
import { AtomicComparison, ComparisonTypes, NormalizedQuery, NormalizedSubQuery } from "@opaquejs/query";
import { OpaqueQueryBuilderContract, OpaqueQueryBuilderModifier } from "./contracts/OpaqueQueryBuilderContracts";

const isEmptyQuery = (query: NormalizedQuery): query is {} => {
  return Object.getOwnPropertyNames(query).length == 0;
};

export class OpaqueQueryBuilderImplementation<Model extends OpaqueTable> implements OpaqueQueryBuilderContract<Model> {
  constructor(public model: Model, public $query: NormalizedQuery = {}) {}

  for(key: PrimaryKeyValue) {
    return this.where(this.model.primaryKey as any, "==", key);
  }

  $getQuery() {
    return this.$query;
  }
  $getSubQuery() {
    return Object.fromEntries(
      Object.entries(this.$getQuery()).filter(([key]) => !["_limit", "_skip"].includes(key))
    ) as NormalizedSubQuery;
  }
  $getRootParts() {
    return Object.fromEntries(
      Object.entries(this.$getQuery()).filter(([key]) => ["_limit", "_skip"].includes(key))
    ) as Pick<NormalizedQuery, "_limit" | "_skip">;
  }

  $cloneForQuery(query: NormalizedQuery) {
    return new (this.constructor as any)(this.model, query) as this;
  }

  where(attribute: string, operator: keyof ComparisonTypes<any> | unknown, value?: unknown): this {
    if (value === undefined) {
      return this.where(attribute, "==", operator);
    }
    return this.$andQuery(this.$makeComparison(attribute, operator as keyof ComparisonTypes<any>, value));
  }
  orWhere(attribute: string, operator: keyof ComparisonTypes<any> | unknown, value?: unknown): this {
    return this.or((query) => query.where(attribute, operator, value));
  }
  get andWhere() {
    return this.where.bind(this);
  }

  $connectQuery(connector: "_and" | "_or", query: NormalizedQuery) {
    const basequery = this.$getSubQuery();
    const rootparts = this.$getRootParts();
    if (connector in basequery) {
      return this.$cloneForQuery({
        ...rootparts,
        ...basequery,
        [connector]: [...(basequery as any)[connector], query],
      });
    }
    if (isEmptyQuery(basequery)) {
      return this.$cloneForQuery({ ...rootparts, ...query });
    }
    return this.$cloneForQuery({ ...rootparts, [connector]: [basequery, query] });
  }
  $andQuery(query: NormalizedQuery) {
    return this.$connectQuery("_and", query);
  }
  $orQuery(query: NormalizedQuery) {
    return this.$connectQuery("_or", query);
  }

  $makeComparison(attribute: string, operator: keyof ComparisonTypes<any>, value: unknown): AtomicComparison {
    return {
      key: attribute,
      comparator: operator,
      value:
        operator == "in"
          ? (value as unknown[]).map((value) => this.model.$serializeAttribute(attribute as any, value))
          : this.model.$serializeAttribute(attribute as any, value),
    } as AtomicComparison;
  }

  limit(_limit: number) {
    return this.$cloneForQuery({
      ...this.$getQuery(),
      _limit,
    });
  }

  skip(_skip: number) {
    return this.$cloneForQuery({
      ...this.$getQuery(),
      _skip,
    });
  }

  or(modifier: OpaqueQueryBuilderModifier<this>) {
    return this.$orQuery(modifier(this.$cloneForQuery({})).$getSubQuery());
  }
  and(modifier: OpaqueQueryBuilderModifier<this>) {
    return this.$andQuery(modifier(this.$cloneForQuery({})).$getSubQuery());
  }

  $hydrate(data: OpaqueAttributes): InstanceType<Model>;
  $hydrate(data: OpaqueAttributes[]): InstanceType<Model>[];
  $hydrate(data: OpaqueAttributes[] | OpaqueAttributes) {
    if (Array.isArray(data)) {
      return data.map((attributes) => this.model.$fromRow(attributes));
    }
    return this.model.$fromRow(data);
  }

  async get() {
    return this.$hydrate(await this.model.adapter.read(this.$query));
  }
  async update(data: Partial<ModelAttributes<InstanceType<Model>>>) {
    return await this.model.adapter.update(this.$query, data);
  }
  async delete() {
    return await this.model.adapter.delete(this.$query);
  }

  async first() {
    return (await this.limit(1).get())[0];
  }
}

export type OpaqueQueryBuilder<Model extends OpaqueTable> = OpaqueQueryBuilderContract<Model>;
export const OpaqueQueryBuilder = OpaqueQueryBuilderImplementation;
